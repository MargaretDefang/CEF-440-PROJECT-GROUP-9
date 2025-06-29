import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pmdarima import auto_arima
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import mutual_info_regression, SelectKBest, f_regression
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Load and preprocess data
def load_and_preprocess_data(file_path):
    """Load and preprocess the dataset with enhanced feature engineering"""
    df = pd.read_csv(file_path)
    
    # Convert date column
    df['date'] = pd.to_datetime(df['date'].astype(int).astype(str), format='%Y%m%d')
    df.set_index('date', inplace=True)
    
    # Filter date range
    df = df[(df.index >= '2015-01-01') & (df.index <= '2016-12-31')]
    
    # Enhanced feature engineering
    df['hour'] = df.index.hour
    df['day_of_week'] = df.index.dayofweek
    df['month'] = df.index.month
    df['season'] = df.index.month % 12 // 3 + 1
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Cyclical encoding for time features
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    # Weather interaction features
    df['temp_humidity'] = df['Temperature'] * df['humidity']
    df['temp_wind'] = df['Temperature'] * df['wind speed']
    df['humidity_wind'] = df['humidity'] * df['wind speed']
    
    # Lag features for irradiance
    df['irradiance_lag1'] = df['irradiance'].shift(1)
    df['irradiance_lag24'] = df['irradiance'].shift(24)  # Previous day same hour
    df['irradiance_lag168'] = df['irradiance'].shift(168)  # Previous week same hour
    
    # Rolling statistics
    df['irradiance_rolling_mean_24h'] = df['irradiance'].rolling(window=24).mean()
    df['irradiance_rolling_std_24h'] = df['irradiance'].rolling(window=24).std()
    
    # Remove rows with NaN values from lag features
    df = df.dropna()
    
    return df

def feature_selection_analysis(train_data, target_col='irradiance'):
    """Perform comprehensive feature selection analysis"""
    # Get all feature columns (excluding target)
    feature_cols = [col for col in train_data.columns if col != target_col]
    
    # Mutual Information Analysis
    mi_scores = mutual_info_regression(train_data[feature_cols], train_data[target_col])
    mi_df = pd.DataFrame({'feature': feature_cols, 'mi_score': mi_scores})
    mi_df = mi_df.sort_values('mi_score', ascending=False)
    
    # Correlation Analysis
    corr_matrix = train_data[feature_cols + [target_col]].corr()
    target_corr = corr_matrix[target_col].abs().sort_values(ascending=False)
    
    # F-statistic Analysis
    f_scores, _ = f_regression(train_data[feature_cols], train_data[target_col])
    f_df = pd.DataFrame({'feature': feature_cols, 'f_score': f_scores})
    f_df = f_df.sort_values('f_score', ascending=False)
    
    print("Top 10 Features by Mutual Information:")
    print(mi_df.head(10))
    print("\nTop 10 Features by Correlation:")
    print(target_corr.head(10))
    print("\nTop 10 Features by F-statistic:")
    print(f_df.head(10))
    
    # Select features based on multiple criteria
    top_mi_features = mi_df[mi_df['mi_score'] > 0.01]['feature'].tolist()
    top_corr_features = target_corr[target_corr > 0.1].index.tolist()
    top_f_features = f_df[f_df['f_score'] > 10]['feature'].tolist()
    
    # Combine features (union of all methods)
    selected_features = list(set(top_mi_features + top_corr_features + top_f_features))
    
    return selected_features, mi_df, target_corr, f_df

def advanced_sarimax_tuning(train_data, target_col, exog_features, seasonal_periods=24):
    """Advanced SARIMAX model tuning with multiple strategies"""
    
    # Strategy 1: Auto ARIMA with wider parameter space
    print("Training Strategy 1: Auto ARIMA with wide parameter space...")
    model1 = auto_arima(
        train_data[target_col],
        exogenous=train_data[exog_features],
        seasonal=True,
        m=seasonal_periods,
        stepwise=False,  # Exhaustive search
        max_p=5, max_q=5, max_d=2,
        max_P=3, max_Q=3, max_D=1,
        information_criterion='aic',
        n_jobs=-1,
        trace=True,
        error_action='ignore',
        suppress_warnings=True
    )
    
    # Strategy 2: Auto ARIMA with different information criterion
    print("\nTraining Strategy 2: Auto ARIMA with BIC criterion...")
    model2 = auto_arima(
        train_data[target_col],
        exogenous=train_data[exog_features],
        seasonal=True,
        m=seasonal_periods,
        stepwise=True,
        information_criterion='bic',
        trace=True,
        error_action='ignore',
        suppress_warnings=True
    )
    
    # Strategy 3: Manual SARIMAX with common solar patterns
    print("\nTraining Strategy 3: Manual SARIMAX with solar patterns...")
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    
    # Common patterns for solar irradiance: (1,1,1)(1,1,1,24)
    model3 = SARIMAX(
        train_data[target_col],
        exog=train_data[exog_features],
        order=(1, 1, 1),
        seasonal_order=(1, 1, 1, seasonal_periods)
    ).fit(disp=False)
    
    return model1, model2, model3

def ensemble_forecast(models, test_exog, n_periods):
    """Generate ensemble forecast from multiple models"""
    forecasts = []
    
    for i, model in enumerate(models):
        try:
            if hasattr(model, 'predict'):
                # For auto_arima models
                forecast = model.predict(n_periods=n_periods, exogenous=test_exog)
            else:
                # For SARIMAX models
                forecast = model.forecast(steps=n_periods, exog=test_exog)
            forecasts.append(forecast)
            print(f"Model {i+1} forecast generated successfully")
        except Exception as e:
            print(f"Model {i+1} failed: {e}")
            continue
    
    if forecasts:
        # Weighted ensemble (can be adjusted based on model performance)
        weights = [0.4, 0.3, 0.3]  # Adjust based on validation performance
        ensemble_forecast = np.zeros(len(forecasts[0]))
        
        for i, forecast in enumerate(forecasts):
            if i < len(weights):
                ensemble_forecast += weights[i] * forecast
            else:
                ensemble_forecast += forecast / len(forecasts)
        
        return ensemble_forecast
    else:
        return None

def cross_validation_sarimax(data, target_col, exog_features, n_splits=5):
    """Time series cross-validation for SARIMAX"""
    from sklearn.model_selection import TimeSeriesSplit
    
    tscv = TimeSeriesSplit(n_splits=n_splits)
    cv_scores = []
    
    for train_idx, val_idx in tscv.split(data):
        train_cv = data.iloc[train_idx]
        val_cv = data.iloc[val_idx]
        
        # Train model on this fold
        model = auto_arima(
            train_cv[target_col],
            exogenous=train_cv[exog_features],
            seasonal=True,
            m=24,
            stepwise=True,
            trace=False,
            error_action='ignore',
            suppress_warnings=True
        )
        
        # Predict on validation set
        forecast = model.predict(n_periods=len(val_cv), exogenous=val_cv[exog_features])
        
        # Calculate metrics
        mae = mean_absolute_error(val_cv[target_col], forecast)
        rmse = np.sqrt(mean_squared_error(val_cv[target_col], forecast))
        r2 = r2_score(val_cv[target_col], forecast)
        
        cv_scores.append({'mae': mae, 'rmse': rmse, 'r2': r2})
    
    return cv_scores

def main():
    # Load and preprocess data
    print("Loading and preprocessing data...")
    df = load_and_preprocess_data(r"D:\FET\LEVEL 400\Second semester\AI\Project_Dataset\Cleaned\cleaned Bambili.csv")
    
    # Split data with more sophisticated approach
    train_size = int(len(df) * 0.8)
    train = df.iloc[:train_size]
    test = df.iloc[train_size:]
    
    print(f"Training set size: {len(train)}")
    print(f"Test set size: {len(test)}")
    
    # Feature selection
    print("\nPerforming feature selection analysis...")
    selected_features, mi_df, target_corr, f_df = feature_selection_analysis(train)
    
    print(f"\nSelected features: {selected_features}")
    
    # Prepare exogenous variables
    train_exog = train[selected_features]
    test_exog = test[selected_features]
    
    # Cross-validation
    print("\nPerforming cross-validation...")
    cv_scores = cross_validation_sarimax(train, 'irradiance', selected_features)
    
    print("\nCross-validation results:")
    for i, scores in enumerate(cv_scores):
        print(f"Fold {i+1}: MAE={scores['mae']:.2f}, RMSE={scores['rmse']:.2f}, R²={scores['r2']:.3f}")
    
    avg_mae = np.mean([s['mae'] for s in cv_scores])
    avg_rmse = np.mean([s['rmse'] for s in cv_scores])
    avg_r2 = np.mean([s['r2'] for s in cv_scores])
    
    print(f"\nAverage CV: MAE={avg_mae:.2f}, RMSE={avg_rmse:.2f}, R²={avg_r2:.3f}")
    
    # Advanced model tuning
    print("\nTraining advanced SARIMAX models...")
    models = advanced_sarimax_tuning(train, 'irradiance', selected_features)
    
    # Generate ensemble forecast
    print("\nGenerating ensemble forecast...")
    ensemble_forecast_result = ensemble_forecast(models, test_exog, len(test))
    
    if ensemble_forecast_result is not None:
        # Evaluate ensemble performance
        mae = mean_absolute_error(test['irradiance'], ensemble_forecast_result)
        rmse = np.sqrt(mean_squared_error(test['irradiance'], ensemble_forecast_result))
        r2 = r2_score(test['irradiance'], ensemble_forecast_result)
        
        print(f"\nEnsemble Model Performance:")
        print(f"MAE: {mae:.2f}")
        print(f"RMSE: {rmse:.2f}")
        print(f"R²: {r2:.3f}")
        
        # Plot results
        plt.figure(figsize=(15, 10))
        
        # Main forecast plot
        plt.subplot(2, 2, 1)
        plt.plot(test.index, test['irradiance'], label='Actual', linewidth=2)
        plt.plot(test.index, ensemble_forecast_result, label='Ensemble Forecast', linewidth=2, alpha=0.8)
        plt.title('Ensemble SARIMAX: Actual vs Predicted Solar Irradiance')
        plt.xlabel('Date')
        plt.ylabel('Irradiance (W/m²)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Residuals plot
        plt.subplot(2, 2, 2)
        residuals = test['irradiance'] - ensemble_forecast_result
        plt.scatter(ensemble_forecast_result, residuals, alpha=0.6)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.xlabel('Predicted Irradiance')
        plt.ylabel('Residuals')
        plt.title('Residual Plot')
        plt.grid(True, alpha=0.3)
        
        # Feature importance
        plt.subplot(2, 2, 3)
        top_features = mi_df.head(10)
        plt.barh(range(len(top_features)), top_features['mi_score'])
        plt.yticks(range(len(top_features)), top_features['feature'])
        plt.xlabel('Mutual Information Score')
        plt.title('Top 10 Feature Importance')
        
        # Performance comparison
        plt.subplot(2, 2, 4)
        metrics = ['MAE', 'RMSE']
        values = [mae, rmse]
        plt.bar(metrics, values, color=['skyblue', 'lightcoral'])
        plt.ylabel('Error Value')
        plt.title('Model Performance Metrics')
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('improved_sarimax_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Save results
        results_df = pd.DataFrame({
            'date': test.index,
            'actual_irradiance': test['irradiance'].values,
            'ensemble_predicted': ensemble_forecast_result,
            'residuals': residuals
        })
        
        results_df.to_csv('improved_sarimax_predictions.csv', index=False)
        
        print("\nResults saved to 'improved_sarimax_predictions.csv'")
        print("Plots saved to 'improved_sarimax_results.png'")
        
        return mae, rmse, r2
    
    else:
        print("Ensemble forecast failed. Trying single best model...")
        # Fallback to best single model
        best_model = models[0]  # Use first successful model
        forecast = best_model.predict(n_periods=len(test), exogenous=test_exog)
        
        mae = mean_absolute_error(test['irradiance'], forecast)
        rmse = np.sqrt(mean_squared_error(test['irradiance'], forecast))
        r2 = r2_score(test['irradiance'], forecast)
        
        print(f"\nSingle Model Performance:")
        print(f"MAE: {mae:.2f}")
        print(f"RMSE: {rmse:.2f}")
        print(f"R²: {r2:.3f}")
        
        return mae, rmse, r2

if __name__ == "__main__":
    mae, rmse, r2 = main()
    print(f"\nFinal Model Performance Summary:")
    print(f"MAE: {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²: {r2:.3f}") 